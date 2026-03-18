import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: {
      type: [
        {
          type: mongoose.ObjectId,
          ref: "Products",
        },
      ],
      required: [true, "products is required"],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "products must contain at least one product",
      },
    },
    payment: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "payment is required"],
      validate: {
        validator: (value) => {
          return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            Object.keys(value).length > 0
          );
        },
        message: "payment must be a non-empty object",
      },
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: [true, "buyer is required"],
    },
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "Delivered", "Cancelled"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);