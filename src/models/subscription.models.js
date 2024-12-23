import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
        //user who is subscribing
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
        //one whose channel is getting subscribed
    }

},
    {timestamps: true});
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
