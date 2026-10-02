import { getAuth } from "@clerk/express";
import Address from "../modal/address.modal.js";
import User from "../modal/user.modal.js";
export const createAddress = async (req, res) => {
  try {
    const { country, city, postalcode, street1, phonenumber } = req.body;
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }
    const address = new Address({
      userId: checkuser._id,
      destination: {
        country,
        city,
        postalcode,
        street1,
      },
      phonenumber,
    });
    await address.save();
    return res.status(200).json({
      success: true,
      message: "Address created successfully",
      address,
    });
  } catch (error) {
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
    const address = await Address.findOne({ _id: addressId, userId: checkuser._id });
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }
    await address.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// get user addresses

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
      createdAt: -1,
    });
    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// update user address

export const updateUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { country, city, postalcode, street1, phonenumber } = req.body;
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }
    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId: checkuser._id },
      {
        destination: {
          country,
          city,
          postalcode,
          street1,
        },
        phonenumber,
      },
      { new: true },
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
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
