import mongoose,{Schema} from "mongoose";

const tweetsSchema = mongoose.Schema(
    {
        owner:{
            type:Schema.Types.ObjectId,
            ref:""
        },
        content: {
            type: String,
            required: true,
          },
    }
,{timestamps:true})

export const Tweet = mongoose.model("Tweet",tweetsSchema)