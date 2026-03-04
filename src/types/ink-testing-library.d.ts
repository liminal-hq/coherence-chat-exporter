declare module "ink-testing-library" {
    import { ReactNode } from "react";
    export interface RenderResult {
        lastFrame: () => string;
        rerender: (tree: ReactNode) => void;
        unmount: () => void;
        stdin: {
            write: (data: string) => boolean;
        };
        frames: string[];
    }
    export function render(tree: ReactNode): RenderResult;
}
