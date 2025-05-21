import { toRaw } from "vue";
import { jwtDecode as jwt_decode } from "jwt-decode";

export function toRawArray(array) {
    return Object.values(toRaw(array)).map(element => toRaw(element));
}

export function jwtDecode(token) {
    const decode = jwt_decode(token);
    return decode;
}

export function isTokenValid() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return false;
    }

    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds

    return decodedToken.exp > currentTime;
}