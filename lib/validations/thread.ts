import { Azeret_Mono } from "next/font/google"
import { z } from "zod"

export const ThreadValidation = z.object({
    thread: z.string().nonempty().min(3, {message: 'Mininum 3 characters'}),
})