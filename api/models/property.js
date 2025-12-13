import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },

  action: {
    type: String, 
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
    title: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required:true,
    },
    price: {
      type: String,
      required: true,
    },
    bedroom:{
      type:String,
      required:true,
    },
    bathroom:{
      type:String,
      required:true,
    },
    publisher_name:{
      type:String,
      required:true,
    },
    publisher_num:{
      type:String,
      required:true,
    },
    publisher_email:{
      type:String,
      required:true,
    },
    image_prefix: {
  type: String,
  required: false
}

  //   imageData: {
  //     type: Buffer,
  //     required: true, // Adjust as needed
  //   },
}
);
const PropertyModel = mongoose.model('properties', PropertySchema);


export default PropertyModel;