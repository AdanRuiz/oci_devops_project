export type SelectOption<TValue extends string = string> = {
    value: TValue
    label: string
    disabled?: boolean
}