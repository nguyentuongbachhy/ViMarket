import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./Button.variants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children: React.ReactNode;
}
