import Notification from "../models/notification.model.js";
import Property from "../models/property.model.js";
import SavedSearch from "../models/savedSearch.model.js";
import User from "../models/user.model.js";
import { buildPropertyQuery } from "./propertyQuery.js";

const formatPrice = (price) => `PKR ${Number(price).toLocaleString("en-PK")}`;

export const notify = (userId, message, link = "") =>
  Notification.create({ user: userId, message, link });

// A new approved listing: tell everyone whose saved search ("Alert me") matches it
export const alertNewListing = async (property) => {
  if (!property.approved) return;
  try {
    const searches = await SavedSearch.find({ user: { $ne: property.owner } });
    for (const search of searches) {
      // Re-use the normal search filters, limited to this one listing
      const matches = await Property.exists({
        ...buildPropertyQuery(search.filters),
        _id: property._id,
      });
      if (matches) {
        await notify(
          search.user,
          `New listing matches your alert: ${property.title} (${formatPrice(property.price)})`,
          `/properties/${property._id}`
        );
      }
    }
  } catch (error) {
    console.error("New listing alerts failed:", error);
  }
};

// The price went down: tell everyone who saved this property
export const alertPriceDrop = async (property, oldPrice) => {
  try {
    const fans = await User.find({ favorites: property._id }, "_id");
    for (const fan of fans) {
      await notify(
        fan._id,
        `Price drop: ${property.title} is now ${formatPrice(property.price)} (was ${formatPrice(oldPrice)})`,
        `/properties/${property._id}`
      );
    }
  } catch (error) {
    console.error("Price drop alerts failed:", error);
  }
};
