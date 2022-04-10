import { extendType, nonNull, objectType, stringArg } from "nexus";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from "./User";
import { APP_SECRET } from "../util/auth";


export const AuthPayload = objectType({
    name: "AuthPayload",
    definition(type) {
        type.nonNull.string("token");
        type.nonNull.field("user", {
            type: User
        });
    },
});

export const AuthMutation = extendType({
    type: "Mutation",
    definition(type) {

        type.nonNull.field("login", {
            type: AuthPayload,
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg()),
            },
            async resolve(parent, args, context, info) {
                const { email, password } = args;
                const user = await context.prisma.user.findFirst({
                    where: { email: email, }
                });
                if (!user) {
                    throw new Error("No such user found");
                }
                const valid = await bcrypt.compare(password, user.password);
                if (!valid) {
                    throw new Error("Wrong Password");
                }

                const token = jwt.sign({ userId: user.id }, APP_SECRET);

                return {
                    token,
                    user,
                }
            }
        });

        type.nonNull.field("signup", {
            type: AuthPayload,
            args: {
                email: nonNull(stringArg()),
                name: nonNull(stringArg()),
                password: nonNull(stringArg()),
            },
            async resolve(parent, args, context, info) {
                const { email, name } = args;
                const password = await bcrypt.hash(args.password, 10);
                const user = await context.prisma.user.create({
                    data: { name, email, password },
                });

                const token = jwt.sign({ userId: user.id }, APP_SECRET);
                return {
                    token,
                    user
                };
            },
        });
    },
});