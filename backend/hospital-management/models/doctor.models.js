import mongoose from "mongoose"

const doctorSchema = new mongoose.Schema({},{timestamps: true});

export const doctor = mongoose.model("doctor", doctorSchema); 