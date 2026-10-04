import { getAuth } from "@clerk/express";
import Address from "../modal/address.modal.js";
import User from "../modal/user.modal.js";

export const createAddress = async (req, res) => {
  try {
    const {
      title,
      recipientName,
      country,
      city,
      district,
      postalcode,
      street1,
      state,
      destination,
      phonenumber,
      coordinates,
      isDefault,
    } = req.body;

    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if this is the first address, auto make it default
    const existingCount = await Address.countDocuments({
      userId: checkuser._id,
    });
    const makeDefault = Boolean(isDefault || existingCount === 0);

    if (makeDefault) {
      await Address.updateMany(
        { userId: checkuser._id },
        { isDefault: false }
      );
    }

    // Address values come only from the customer (no hardcoded fallbacks)
    const pick = (a, b) => (typeof (a ?? b) === "string" ? (a ?? b).trim() : undefined);
    const dest = {
      country: pick(destination?.country, country),
      city: pick(destination?.city, city),
      district: pick(destination?.district, district),
      postalcode: pick(destination?.postalcode, postalcode),
      street1: pick(destination?.street1, street1),
      state: pick(destination?.state, state),
    };
    const phone = (phonenumber || checkuser.phonenumber || "").trim();

    const missing = [];
    if (!dest.country) missing.push("الدولة");
    if (!dest.city) missing.push("المدينة");
    if (!dest.street1) missing.push("اسم الشارع");
    if (!dest.postalcode) missing.push("الرمز البريدي");
    if (!phone) missing.push("رقم الجوال");
    if (missing.length) {
      return res.status(400).json({ error: `الحقول التالية مطلوبة: ${missing.join("، ")}` });
    }

    const address = new Address({
      userId: checkuser._id,
      title: title || "المنزل",
      recipientName: recipientName || checkuser.name || "",
      destination: dest,
      coordinates: coordinates || undefined,
      phonenumber: phone,
      isDefault: makeDefault,
    });

    await address.save();

    return res.status(201).json({
      success: true,
      message: "تمت إضافة العنوان بنجاح",
      address,
    });
  } catch (error) {
    console.error("createAddress error:", error);
    if (error?.name === "ValidationError") {
      const msg = Object.values(error.errors).map((e) => e.message).join("، ");
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }

    const address = await Address.findOne({
      _id: addressId,
      userId: checkuser._id,
    });
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If deleted address was default, promote latest remaining address
    if (wasDefault) {
      const latest = await Address.findOne({ userId: checkuser._id }).sort({
        createdAt: -1,
      });
      if (latest) {
        latest.isDefault = true;
        await latest.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "تم حذف العنوان بنجاح",
    });
  } catch (error) {
    console.error("deleteAddress error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Get all user addresses
export const getUserAddresses = async (req, res) => {
  try {
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }

    const addresses = await Address.find({ userId: checkuser._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("getUserAddresses error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Set address as default
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set all other addresses for this user to isDefault: false
    await Address.updateMany(
      { userId: checkuser._id },
      { isDefault: false }
    );

    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId: checkuser._id },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ error: "العنوان غير موجود" });
    }

    return res.status(200).json({
      success: true,
      message: "تم تعيين العنوان كافتراضي بنجاح",
      address,
    });
  } catch (error) {
    console.error("setDefaultAddress error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Update user address
export const updateUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const {
      title,
      recipientName,
      country,
      city,
      district,
      postalcode,
      street1,
      state,
      destination,
      phonenumber,
      coordinates,
      isDefault,
    } = req.body;

    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (isDefault) {
      await Address.updateMany(
        { userId: checkuser._id },
        { isDefault: false }
      );
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (recipientName !== undefined) updates.recipientName = recipientName;
    if (phonenumber !== undefined) updates.phonenumber = phonenumber;
    if (coordinates !== undefined) updates.coordinates = coordinates;
    if (isDefault !== undefined) updates.isDefault = Boolean(isDefault);

    if (destination || country || city || district || postalcode || street1 || state) {
      const existing = await Address.findOne({
        _id: addressId,
        userId: checkuser._id,
      });
      if (existing) {
        // Keep existing values for fields the customer didn't send — never invent values
        const val = (a, b, old) => {
          const v = a ?? b;
          return typeof v === "string" ? v.trim() : old;
        };
        const prev = existing.destination || {};
        updates.destination = {
          country: val(destination?.country, country, prev.country),
          city: val(destination?.city, city, prev.city),
          district: val(destination?.district, district, prev.district),
          postalcode: val(destination?.postalcode, postalcode, prev.postalcode),
          street1: val(destination?.street1, street1, prev.street1),
          state: val(destination?.state, state, prev.state),
        };
      }
    }

    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId: checkuser._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({ error: "لم يتم العثور على العنوان" });
    }

    return res.status(200).json({
      success: true,
      message: "تم تحديث العنوان بنجاح",
      address,
    });
  } catch (error) {
    console.error("updateUserAddress error:", error);
    if (error?.name === "ValidationError") {
      const msg = Object.values(error.errors).map((e) => e.message).join("، ");
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
