import type { BugSeverity } from '../enums/bug-severity.enum';

export type BugDetails = {
    severity?: BugSeverity;
    environment?: string;
    isReproducible?: boolean;
    steps?: string;
};