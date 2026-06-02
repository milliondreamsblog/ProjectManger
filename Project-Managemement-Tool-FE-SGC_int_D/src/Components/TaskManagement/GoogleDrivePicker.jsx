// src/components/GoogleDrivePicker.js

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

function GoogleDrivePicker({ onFilesPicked }) {
  const tokenClientRef = useRef(null);
  const accessTokenRef = useRef(null);
  const pickerApiLoadedRef = useRef(false);
  let gapiLoaded = false;
  let oauthLoaded = false;

  const checkIfReady = () => {
    if (gapiLoaded && oauthLoaded) {
      window.gapi.load("client:picker", onGapiLoad);
    }
  };
  useEffect(() => {
    const loadGoogleScripts = () => {
      if (!window.gapi) {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        // script.onload = () => {
        //   window.gapi.load('client:picker', onGapiLoad);
        // };
        script.onload = () => {
          gapiLoaded = true;
          checkIfReady();
        };
        document.body.appendChild(script);
      } else {
        // window.gapi.load('client:picker', onGapiLoad);
        gapiLoaded = true;
        checkIfReady();
      }

      // if (!window.google || !window.google.accounts) {
      //   const script2 = document.createElement('script');
      //   script2.src = 'https://accounts.google.com/gsi/client';
      //   document.body.appendChild(script2);
      // }

      if (!window.google || !window.google.accounts) {
        const script2 = document.createElement("script");
        script2.src = "https://accounts.google.com/gsi/client";
        script2.onload = () => {
          oauthLoaded = true;
          checkIfReady();
        };
        document.body.appendChild(script2);
      } else {
        oauthLoaded = true;
        checkIfReady();
      }
    };

    loadGoogleScripts();
    // eslint-disable-next-line
  }, []);

  const onGapiLoad = async () => {
    await window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
    });

    pickerApiLoadedRef.current = true;

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        accessTokenRef.current = tokenResponse.access_token;
        createPicker();
      },
    });
  };

  const handleAuthClick = () => {
    if (!pickerApiLoadedRef.current) {
      alert("Google Picker API not loaded yet.");
      return;
    }

    if (accessTokenRef.current) {
      createPicker();
    } else {
      tokenClientRef.current.requestAccessToken();
    }
  };

  const createPicker = () => {
    const view = new window.google.picker.View(
      window.google.picker.ViewId.DOCS
    );

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(accessTokenRef.current)
      .setDeveloperKey(GOOGLE_API_KEY)
      .addView(view)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const files = data.docs.map((file) => ({
        name: file.name,
        url: file.url,
        isDrive: true,
      }));
      //console.log("files", files);
      if (onFilesPicked) {
        onFilesPicked(files);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleAuthClick}
      className="input-action-button"
    >
      <span className="attachment-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="28"
          viewBox="0 0 36 36"
          width="28"
        >
          <g fill="none" fillRule="evenodd">
            <path d="m0 0h36v36h-36z" />
            <g fillRule="nonzero" transform="translate(3 4.363636)">
              <path
                d="m20.5107955 18.0681818 1.29375 4.4607955 3.3903409 3.6511363c.4585227-.2642045.8488636-.6477272 1.1232954-1.1232954l3.15-5.4545455c.2744318-.4738636.4107955-1.0039772.4107955-1.5340909l-4.8375-.9375z"
                fill="#ea4335"
              />
              <path
                d="m19.6840909.41079546c-.4585227-.26420455-.9852273-.41079546-1.5340909-.41079546h-6.2982955c-.5454545 0-1.0772727.15-1.5340909.41079546l1.3568182 4.56988636 3.3136364 3.51818182.0119318.02386363 3.3375-3.56079545z"
                fill="#188038"
              />
              <path
                d="m9.48920455 18.0681818-4.82897728-1.1079545-4.5375 1.1079545c0 .5284091.13636364 1.0568182.40909091 1.5323864l3.15 5.45625c.27443182.4738636.66477273.8573863 1.12329546 1.1232954l3.33920454-3.4397727z"
                fill="#1967d2"
              />
              <path
                d="m25.1369318 9.03409091-4.3295454-7.5c-.2744319-.47556818-.6647728-.85909091-1.1232955-1.12329545l-4.6840909 8.11193181 5.5107955 9.54545453h9.3664772c0-.5301136-.1363636-1.0585227-.4107954-1.5340909z"
                fill="#fbbc04"
              />
              <path
                d="m20.5107955 18.0681818h-11.02159095l-4.68409091 8.1119318c.45852272.2642046.98522727.4107955 1.53409091.4107955h17.31988635c.5488636 0 1.0755682-.1465909 1.5340909-.4107955z"
                fill="#4285f4"
              />
              <path
                d="m15 8.52272727-4.6823864-8.11193181c-.45852269.26420454-.84715905.64602272-1.12159087 1.11988636l-8.66420455 15.00852268c-.27272727.4738637-.40909091 1.0022728-.40909091 1.5289773h9.36647728z"
                fill="#34a853"
              />
            </g>
          </g>
        </svg>
      </span>
    </button>
  );
}

GoogleDrivePicker.propTypes = {
  onFilesPicked: PropTypes.func.isRequired,
};

export default GoogleDrivePicker;
