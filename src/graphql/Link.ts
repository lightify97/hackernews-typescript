import { extendType, nonNull, objectType, stringArg, intArg, inputObjectType, enumType, arg, list } from "nexus";
// import { NexusGenObjects } from "../../nexus-typegen";
import { User } from "./User";
import { Prisma } from "@prisma/client";

export const Link = objectType({
    name: "Link",
    definition(type) {
        type.nonNull.int("id");
        type.nonNull.string("description");
        type.nonNull.string("url");
        type.nonNull.dateTime("createdAt")
        type.field("postedBy", {
            type: User,
            resolve(parent, args, context) {
                return context.prisma.link.findUnique({
                    where: {
                        id: parent.id,
                    }
                }).postedBy();
            }
        });

        type.nonNull.list.nonNull.field("voters", {
            type: "User",
            resolve(parent, args, context, info) {
                return context.prisma.link.findUnique({ where: { id: parent.id } })
                    .voters();
            }
        })
    }
});

export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("feed", {  // 1
            type: "Feed",
            args: {
                filter: stringArg(),
                skip: intArg(),
                take: intArg(),
                orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
            },
            async resolve(parent, args, context) {
                const where = args.filter
                    ? {
                        OR: [
                            { description: { contains: args.filter } },
                            { url: { contains: args.filter } },
                        ],
                    }
                    : {};

                const links = await context.prisma.link.findMany({
                    where,
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as
                        | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
                        | undefined,
                });

                const count = await context.prisma.link.count({ where });  // 2

                return {  // 3
                    links,
                    count,
                };
            },
        });
    },
});

export const LinkOrderByInput = inputObjectType({
    name: "LinkOrderByInput",
    definition(t) {
        t.field("description", { type: Sort });
        t.field("url", { type: Sort });
        t.field("createdAt", { type: Sort });
    },
});

export const Sort = enumType({
    name: "Sort",
    members: ["asc", "desc"],
});


export const LinkMutation = extendType({
    type: "Mutation",
    definition(type) {
        type.nonNull.field("post", {
            type: Link,
            args: {
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },
            resolve(parent, args, context) {
                const { description, url } = args;
                const { userId } = context;
                if (!userId) {
                    throw new Error("User not Authenticated");
                }
                const newLink = context.prisma.link.create({
                    data: {
                        description,
                        url,
                        postedBy: { connect: { id: userId } },  // 2
                    },
                });

                return newLink;
            },
        });


    },
});

export const LinkByID = extendType({
    type: "Query",
    definition(type) {
        type.field("link", {
            type: Link,
            args: {
                id: nonNull(intArg()),
            },
            resolve(root, args, context) {
                const { id } = args;
                return context.prisma.link.findUnique({
                    where: {
                        id: id
                    }
                });
            }
        })
    }
})


export const UpdateLink = extendType({
    type: "Mutation",
    definition(type) {
        type.field("updateLink", {
            type: Link,
            args: {
                id: nonNull(intArg()),
                url: stringArg(),
                description: stringArg(),
            },
            async resolve(parent, args, context, info) {
                return await context.prisma.link.update({
                    where: {
                        id: args.id,
                    },
                    data: {
                        url: args.url,
                        description: args.description
                    }
                }).catch((e) => e)
            },
        });
    },
});

export const DeleteLink = extendType({
    type: "Mutation",
    definition(type) {
        type.nonNull.field("deleteLink", {
            type: Link,
            args: {
                id: nonNull(intArg()),
            },
            resolve(root, args, context, info) {
                return context.prisma.link.delete({
                    where: {
                        id: args.id
                    }
                })
            }
        })
    }
})

export const Feed = objectType({
    name: "Feed",
    definition(t) {
        t.nonNull.list.nonNull.field("links", { type: Link }); // 1
        t.nonNull.int("count"); // 2
    },
});