// TODO Cookies
import Cookies from 'js-cookie';
// import { getEnv } from "./utils";

let domain = document.domain;
if (!window.location.port || import.meta.env.MODE !== 'development') {
	// TODO: domain 接环境
	domain = ``;
}
const cookie = {
	get(key: string) {
		return Cookies.get(key);
	},

	set(key: string, strVal: string) {
		return Cookies.set(key, strVal, { domain });
	},

	remove(key: string) {
		return Cookies.remove(key, { domain });
	},

	batchRemove(keys: string[]) {
		keys.forEach(item => {
			Cookies.remove(item, { domain });
		});
	},
};

export default cookie;
