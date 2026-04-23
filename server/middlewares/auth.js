import { clerkClient } from "@clerk/express";




export const auth = async (req, res, next) => {
    try{
        if (process.env.TEST_MODE === 'true') {
            req.plan = 'premium';
            req.free_usage = 0;
            req.auth = async () => ({ userId: 'test_user_id', has: async () => true });
            return next();
        }

        const {userId, has} = await req.auth();
        const hasPremiumPlan = await has({plan: 'premium'})

        const user = await clerkClient.users.getUser(userId);

        if(!hasPremiumPlan && user.privateMetadata.free_usage){
            req.free_usage = user.privateMetadata.free_usage;
        } else {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: 0
                }
            })
            req.free_usage = 0;
        }
        req.plan = hasPremiumPlan ? 'premium' : 'free';
        next();
    } catch(error){
        next(error);
    }
}