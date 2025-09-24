import { store } from "../../../../store/store";

import { auth, provider, signInWithPopup } from "../../../../services/firebase"
import api from "../../../../services/api"
import { setAuthenticated, setUser } from "../../../../store/user/userSlice";

const handleGoogleLogin = async () => {
    console.log('its google');
    
    try {
        const result = await signInWithPopup(auth, provider);
        const token = await result.user.getIdToken();
        console.log("Firebase Token:", token);

        const response = await api.post("users/google-login/", { token:token });

        if (response.status === 200) {
            console.log("Google authentication successful!", response.data);
            store.dispatch(setAuthenticated(true))
            store.dispatch(setUser(response.data.user));
            window.location.href = '/';
        } else {
            console.error("Failed to authenticate with backend");
        }
    } catch (error) {
        console.error("Google Sign-In Error:", error);
    }
};

export default handleGoogleLogin;