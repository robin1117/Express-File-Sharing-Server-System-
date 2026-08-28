import z4, { object } from "zod/v4";

export let emailSchema = z4.object({
  email: z4.email("plase enter a valid Email example@gmail.com").toLowerCase(),
});

export let loginSchema = emailSchema.extend({
  password: z4.string().min(3, "password length should be more than 3"),
});

export let registerShema = loginSchema.extend({
  name: z4
    .string("name should be a type of string")
    .min(3, "name should be length of more than 3")
    .max(20),
});

export let otpSchema = emailSchema.extend({
  otp: z4
    .string("please enter a valid Otp string")
    .regex(/^\d{4}$/, "please enter a valid Otp 4 digits"),
});

export let resetPasswordSchema = z4.object({
  token: z4.string("token should be a type of string"),
  password: z4.string("password should be a type of string"),
});
