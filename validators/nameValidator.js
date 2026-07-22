import z4 from "zod/v4";

export let renameSchema = z4
  .string("Directory Name should an string !")
  .min(3, "minimum length of name string must be greater than 3");
