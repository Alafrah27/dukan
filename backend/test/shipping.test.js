import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import shippingRouter from "../src/route/shipping.route.js";
import provider from "../src/services/shipping/providers/aramex.provider.js";
import shippingService from "../src/services/shipping/shipping.service.js";
import Cart from "../src/modal/cart.modal.js";
import TailoringPrice from "../src/modal/tailoring.modal.js";
import User from "../src/modal/user.modal.js";
import {
  calculateCartShipping,
  calculateCartSummary,
} from "../src/controller/cart.controller.js";

const options = {
  origin: { countryCode: "SA", city: "Riyadh" },
  destination: { countryCode: "AE", city: "Dubai", postalCode: "" },
  packageDetails: { weight: 1.5, numberOfPieces: 1 },
  currency: "SAR",
};
const rate = {
  HasErrors: false,
  TotalAmount: { Value: "65.50", CurrencyCode: "SAR" },
  RateDetails: { TaxAmount: 5 },
};

function configure(t, environment = "dev") {
  const values = {
    ARAMEX_ENV: environment,
    ARAMEX_USER_NAME: "test-user",
    ARAMEX_PASSWORD: "test-password",
    ARAMEX_ACCOUNT_NUMBER: "test-account",
    ARAMEX_ACCOUNT_PIN: "test-pin",
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, values);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

async function request(t, payload) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/shipping", shippingRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v1/shipping/calculate-rate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return { status: response.status, body: await response.json() };
}

test("Get Shipping Rates posts the correct JSON schema and returns the carrier amount", async (t) => {
  configure(t);
  t.mock.method(axios, "post", async (url, payload, config) => {
    assert.equal(
      url,
      "https://ws.dev.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate",
    );
    assert.equal(payload.PreferredCurrencyCode, "SAR");
    assert.deepEqual(payload.ShipmentDetails.ActualWeight, {
      Value: 1.5,
      Unit: "KG",
    });
    assert.equal(payload.ShipmentDetails.ProductGroup, "EXP");
    assert.equal(payload.ShipmentDetails.ProductType, "PPX");
    assert.equal(payload.DestinationAddress.PostCode, "");
    assert.equal(payload.ShipmentDetails.Dimensions, null);
    assert.equal(config.timeout, 10000);
    return { data: rate };
  });
  const { status, body } = await request(t, options);
  assert.equal(status, 200);
  assert.equal(body.quotes[0].price, 65.5);
  assert.equal(body.quotes[0].isLiveQuote, true);
  assert.equal(body.quotes[0].isSandbox, true);
  assert.equal(body.quotes[0].estimatedDays, null);
  assert.equal(JSON.stringify(body).includes("test-password"), false);
});

test("domestic, document and economy services use the right product codes", async (t) => {
  configure(t, "live");
  let lastPayload;
  t.mock.method(axios, "post", async (url, payload) => {
    assert.ok(url.startsWith("https://ws.aramex.net/"));
    lastPayload = payload;
    return { data: rate };
  });
  const domestic = await provider.calculateRate({
    ...options,
    destination: { countryCode: "sa", city: "Jeddah" },
  });
  assert.equal(lastPayload.ShipmentDetails.ProductGroup, "DOM");
  assert.equal(domestic.productType, "OND");
  assert.equal(domestic.isSandbox, false);
  const document = await provider.calculateRate({
    ...options,
    packageDetails: { shipmentType: "document" },
  });
  assert.equal(document.productType, "PDX");
  const economy = await provider.calculateRate({
    ...options,
    packageDetails: { preferEconomy: true },
  });
  assert.equal(economy.productType, "EPX");
  assert.equal(economy.serviceName, "Aramex Economy Parcel Express");
});

test("weight units, dimensions and actual international postal codes reach Aramex unchanged", async (t) => {
  configure(t);
  t.mock.method(axios, "post", async (_url, payload) => {
    assert.equal(payload.ShipmentDetails.ActualWeight.Value, 2 * 0.45359237);
    assert.deepEqual(payload.ShipmentDetails.Dimensions, {
      Length: 10,
      Width: 5,
      Height: 4,
      Unit: "IN",
    });
    assert.equal(payload.DestinationAddress.PostCode, "SW1A 1AA");
    assert.equal(payload.DestinationAddress.City, "London");
    assert.equal(payload.DestinationAddress.Line1, "A & B <House>");
    return { data: rate };
  });
  await provider.calculateRate({
    ...options,
    destination: {
      countryCode: "GB",
      city: "London",
      postalCode: "SW1A 1AA",
      addressLine1: "A & B <House>",
    },
    packageDetails: {
      weight: 2,
      weightUnit: "LB",
      length: 10,
      width: 5,
      height: 4,
      dimensionUnit: "IN",
    },
  });
});

test("invalid inputs are rejected before calling Aramex", async (t) => {
  configure(t);
  const post = t.mock.method(axios, "post", async () => {
    throw new Error("must not call");
  });
  const invalid = [
    { destination: { countryCode: "Saudi Arabia", city: "Riyadh" } },
    { destination: { countryCode: "AE", city: " " } },
    { origin: "SA" },
    { origin: null },
    { destination: [] },
    { currency: "" },
    { packageDetails: null },
    { packageDetails: { weight: -1 } },
    { packageDetails: { weight: 0 } },
    { packageDetails: { weight: null } },
    { packageDetails: { weight: true } },
    { packageDetails: { weight: "1oops" } },
    { packageDetails: { weight: Infinity } },
    { packageDetails: { numberOfPieces: 1.5 } },
    { packageDetails: { length: 10 } },
    { packageDetails: { length: -1, width: 10, height: 1 } },
    { packageDetails: { weightUnit: "G" } },
    { provider: "constructor" },
    { provider: {} },
  ];
  for (const changes of invalid) {
    await assert.rejects(
      shippingService.getQuotes({ ...options, ...changes }),
      (error) => error.status === 400,
    );
  }
  assert.equal(post.mock.callCount(), 0);
});

test("legacy calculator zero dimensions are treated as unspecified", async (t) => {
  configure(t);
  t.mock.method(axios, "post", async (_url, payload) => {
    assert.equal(payload.ShipmentDetails.Dimensions, null);
    return { data: rate };
  });
  const quote = await provider.calculateRate({
    ...options, packageDetails: { weight: 1, length: 0, width: 0, height: 0 },
  });
  assert.equal(quote.price, 65.5);
});

test("unconfigured accounts return 503 with no invented fallback rate", async (t) => {
  configure(t);
  process.env.ARAMEX_PASSWORD = "";
  const post = t.mock.method(axios, "post", async () => {
    throw new Error("must not call");
  });
  const { status, body } = await request(t, options);
  assert.equal(status, 503);
  assert.equal(body.success, false);
  assert.equal(body.quotes, undefined);
  assert.equal(post.mock.callCount(), 0);
});

test("carrier rejection, timeout and transport errors propagate through the endpoint safely", async (t) => {
  configure(t);
  for (const scenario of [
    {
      data: {
        HasErrors: true,
        Notifications: [{ Message: "secret account details" }],
      },
      status: 422,
    },
    { error: { code: "ECONNABORTED", message: "test-password" }, status: 504 },
    { error: { code: "ECONNRESET", message: "test-password" }, status: 502 },
  ]) {
    t.mock.method(axios, "post", async () => {
      if (scenario.error) throw scenario.error;
      return { data: scenario.data };
    });
    const { status, body } = await request(t, options);
    assert.equal(status, scenario.status);
    assert.equal(body.success, false);
    assert.equal(JSON.stringify(body).includes("test-password"), false);
    assert.equal(
      JSON.stringify(body).includes("secret account details"),
      false,
    );
  }
});

test("malformed, nonpositive and wrong-currency carrier amounts never become usable quotes", async (t) => {
  configure(t);
  for (const data of [
    "<html>gateway error</html>",
    {},
    { ...rate, HasErrors: "false" },
    ...[null, "", "not-a-number", -1, 0, Infinity].map((Value) => ({
      ...rate,
      TotalAmount: { Value, CurrencyCode: "SAR" },
    })),
    { ...rate, TotalAmount: { Value: 65, CurrencyCode: "USD" } },
  ]) {
    t.mock.method(axios, "post", async () => ({ data }));
    await assert.rejects(
      provider.calculateRate(options),
      (error) => error.status === 502,
    );
  }
});

test("cart quote is invalidated after item, quantity or address changes", async (t) => {
  t.mock.method(Cart.collection, "insertOne", async () => ({
    acknowledged: true,
  }));
  t.mock.method(Cart.collection, "updateOne", async () => ({
    acknowledged: true,
    matchedCount: 1,
  }));
  const cart = new Cart({
    userId: new mongoose.Types.ObjectId(),
    addressId: new mongoose.Types.ObjectId(),
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        purchaseOption: "farbic_only",
        quantity: 1,
      },
    ],
  });
  await cart.save();
  const quote = () => ({
    price: 65.5,
    isCalculated: true,
    isLiveQuote: true,
    isSandbox: true,
  });
  cart.aramex = quote();
  await cart.save();
  assert.equal(cart.aramex.isCalculated, true);
  cart.items[0].quantity = 2;
  await cart.save();
  assert.equal(cart.aramex, undefined);
  cart.aramex = quote();
  await cart.save();
  cart.addressId = new mongoose.Types.ObjectId();
  await cart.save();
  assert.equal(cart.aramex, undefined);
  cart.aramex = quote();
  await cart.save();
  cart.items = [];
  await cart.save();
  assert.equal(cart.aramex, undefined);
});

test("cart totals exclude legacy estimates and invalidated shipping", async (t) => {
  t.mock.method(TailoringPrice, "find", async () => []);
  const cart = {
    items: [{ product: { basePrice: 100 }, quantity: 2 }],
    aramex: { price: 45, isCalculated: true },
  };
  assert.equal((await calculateCartSummary(cart)).finalTotal, 200);
  cart.aramex.isLiveQuote = true;
  assert.equal((await calculateCartSummary(cart)).finalTotal, 245);
  cart.aramex.isCalculated = false;
  assert.equal((await calculateCartSummary(cart)).finalTotal, 200);
});

test("cart rate calculation uses saved international address and persists quote metadata", async (t) => {
  configure(t);
  const user = { _id: new mongoose.Types.ObjectId() };
  const cart = {
    items: [{ product: { basePrice: 100 }, quantity: 1 }],
    addressId: {
      destination: {
        country: "US",
        city: "New York",
        postalcode: "10002",
        state: "NY",
        street1: "Customer street",
      },
    },
    save: async () => {},
  };
  t.mock.method(User, "findOne", async () => user);
  t.mock.method(Cart, "findOne", () => {
    const query = {
      populate: () => query,
      then: (resolve) => Promise.resolve(cart).then(resolve),
    };
    return query;
  });
  t.mock.method(TailoringPrice, "find", async () => []);
  t.mock.method(axios, "post", async (_url, payload) => {
    assert.equal(payload.DestinationAddress.CountryCode, "US");
    assert.equal(payload.DestinationAddress.PostCode, "10002");
    assert.equal(payload.DestinationAddress.StateOrProvinceCode, "NY");
    assert.equal(payload.DestinationAddress.Line1, "Customer street");
    assert.equal(payload.ShipmentDetails.ActualWeight.Value, 2);
    return { data: rate };
  });
  const auth = Object.assign(
    () => ({ userId: "test-clerk-user", tokenType: "session_token" }),
    {
      [Symbol.for("@clerk/express.auth")]: true,
    },
  );
  const req = { body: { kilo: 2 }, auth };
  let status;
  let body;
  const res = {
    status: (value) => {
      status = value;
      return res;
    },
    json: (value) => {
      body = value;
      return res;
    },
  };
  await calculateCartShipping(req, res);
  assert.equal(status, 200);
  assert.equal(body.aramex.isLiveQuote, true);
  assert.equal(body.aramex.productType, "PPX");
  assert.equal(body.aramex.estimatedDays, "");
  assert.equal(body.summary.finalTotal, 165.5);
});
