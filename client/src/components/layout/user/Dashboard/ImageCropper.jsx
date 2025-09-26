import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import Slider from "@mui/material/Slider";

const ImageCropper = ({ image, onCropDone, onCropCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [initialZoom, setInitialZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

  const onCropComplete = useCallback(
    (croppedAreaPercentage, croppedAreaPixels) => {
      setCroppedArea(croppedAreaPixels);
    },
    []
  );

  const onMediaLoaded = useCallback(
    ({ width, height, naturalWidth, naturalHeight }) => {
      const containerRatio = width / height;

      const imageRatio = naturalWidth / naturalHeight;

      let zoomLevel;
      if (containerRatio > imageRatio) {
        zoomLevel = height / naturalHeight;
      } else {
        zoomLevel = width / naturalWidth;
      }

      zoomLevel = zoomLevel * 1.01;

      setZoom(zoomLevel);
      setInitialZoom(zoomLevel * 0.8);
    },
    []
  );

  // Toggle aspect ratio between portrait and landscape
  // const toggleAspectRatio = () => {
  //   setAspectRatio(aspectRatio === 3/5 ? 5/3 : 3/5);
  // };

  // Reset crop to center
  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(initialZoom);
  };

  return (
    <div className="relative w-full h-[500px] flex flex-col">
      <div className="flex-grow relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          minZoom={initialZoom * 0.8}
          maxZoom={3}
          // aspect={aspectRatio}
          aspect={3 / 5}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          onMediaLoaded={onMediaLoaded}
          objectFit="contain"
          showGrid={true}
          style={{
            containerStyle: {
              width: "100%",
              height: "100%",
              backgroundColor: "#1a1a1a",
              position: "relative",
            },
            cropAreaStyle: {
              border: "2px solid #fff",
              boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.7)",
            },
          }}
        />
      </div>

      <div className="p-4 bg-[#2C2C2C]">
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <label className="text-white text-sm">Zoom</label>
            <span className="text-white text-sm">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <Slider
            value={zoom}
            min={initialZoom * 0.8}
            max={3}
            step={0.01}
            aria-labelledby="zoom"
            onChange={(e, zoom) => setZoom(zoom)}
            className="range"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="space-x-2">
            <Button
              type="button"
              onClick={resetCrop}
              variant="outline"
              className="bg-gray-700 text-white text-sm"
            >
              Reset
            </Button>
            {/* <Button 
              type="button" 
              onClick={toggleAspectRatio} 
              variant="outline" 
              className="bg-gray-700 text-white text-sm"
            >
              {aspectRatio === 3/5 ? "Portrait" : "Landscape"}
            </Button> */}
          </div>
          <div className="space-x-2">
            <Button
              type="button"
              onClick={onCropCancel}
              variant="outline"
              className="bg-gray-700 text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => onCropDone(croppedArea)}
              className="bg-green-500 text-white"
            >
              Crop & Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
