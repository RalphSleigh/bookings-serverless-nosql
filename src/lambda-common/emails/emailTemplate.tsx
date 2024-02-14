import { ConfigType } from "../config.js";
import { BasicEmailData, EmailData } from "../email.js";
import { EventType } from "../onetable.js";

export abstract class EmailTemplate {
    abstract subject(data: EmailData): string
    abstract HTLMBody(data: EmailData, config: ConfigType): React.ReactElement
}