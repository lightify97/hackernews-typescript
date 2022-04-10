import { extendType, objectType } from "nexus";
import { Link } from "./Link";

export const User = objectType({
    name: "User",
    definition(type) {
        type.nonNull.int("id");
        type.nonNull.string("name");
        type.nonNull.string("email");
        type.nonNull.list.nonNull.field("links", {
            type: Link,
            resolve(parent, args, context, info) {
                return context.prisma.user.findUnique({
                    where: {
                        id: parent.id
                    },
                }).links();
            },
        });
        type.nonNull.list.nonNull.field("votes", {
            type: Link,
            resolve(parent, args, context) {
                return context.prisma.user
                    .findUnique({ where: { id: parent.id } })
                    .votes();
            }
        });
    },
});

