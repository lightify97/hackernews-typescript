import { extendType, intArg, nonNull, objectType } from "nexus";
import { Link } from "./Link";
// import { User } from "./User";
import { User } from "@prisma/client";

export const Vote = objectType({
    name: "Vote",
    definition(type) {
        type.nonNull.field("link", { type: "Link" });
        type.nonNull.field("user", { type: "User" });
    },
});


export const VoteMutation = extendType({
    type: "Mutation",
    definition(type) {
        type.field("vote", {
            type: Vote,
            args: {
                linkId: nonNull(intArg()),
            },
            async resolve(parent, args, context) {
                const { userId } = context;
                const { linkId } = args;

                if (!userId) {  // 1 
                    throw new Error("Cannot vote without logging in.");
                }

                const link = await context.prisma.link.update({  // 2
                    where: {
                        id: linkId
                    },
                    data: {
                        voters: {
                            connect: {
                                id: userId
                            }
                        }
                    }
                })

                const user = await context.prisma.user.findUnique({ where: { id: userId } });

                return {  // 3
                    link,
                    user: user as User
                };
            },
        });
    },
})