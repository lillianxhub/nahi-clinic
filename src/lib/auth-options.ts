import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username.trim() },
                });

                if (!user || user.deleted_at || !user.is_active) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password_hash,
                );

                // fallback for migration path if necessary
                const isPlainValid =
                    credentials.password === user.password_hash;

                if (!isPasswordValid && !isPlainValid) {
                    return null;
                }

                return {
                    id: user.user_id,
                    name: user.username,
                    email: user.username, // NextAuth expects email or name
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.name ?? "";
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.username = token.username;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};
