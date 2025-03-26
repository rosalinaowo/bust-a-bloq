import { toRaw } from "vue";

export function toRawArray(array) {
    return Object.values(toRaw(array)).map(element => toRaw(element));
}