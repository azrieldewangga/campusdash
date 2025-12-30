import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Crop, Check } from 'lucide-react';

// Helper to center crop with 1:1 aspect ratio
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 80,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

const ImageCropperWindow = () => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<CropType>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    // Theme sync
    useEffect(() => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, []);

    // Get image from localStorage (passed from settings)
    useEffect(() => {
        const img = localStorage.getItem('cropperImage');
        if (img) {
            setImageSrc(img);
        }
    }, []);

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1));
    }, []);

    const handleApply = useCallback(() => {
        if (!imgRef.current || !completedCrop) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Use a reasonable output size (256x256 for profile pic)
        const outputSize = 256;
        canvas.width = outputSize;
        canvas.height = outputSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            outputSize,
            outputSize
        );

        const base64 = canvas.toDataURL('image/jpeg', 0.9);

        // Save result and close
        localStorage.setItem('croppedImage', base64);
        localStorage.removeItem('cropperImage');

        // Close window
        // @ts-ignore
        if (window.electronAPI?.close) {
            // @ts-ignore
            window.electronAPI.close();
        } else {
            window.close();
        }
    }, [completedCrop]);

    const handleCancel = () => {
        localStorage.removeItem('cropperImage');
        // @ts-ignore
        if (window.electronAPI?.close) {
            // @ts-ignore
            window.electronAPI.close();
        } else {
            window.close();
        }
    };

    if (!imageSrc) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <p className="text-base-content/50">No image to crop</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 flex flex-col">
            {/* Title Bar */}
            <div className="titlebar-drag bg-base-200 px-4 py-3 flex items-center justify-between border-b border-base-300">
                <h1 className="font-semibold flex items-center gap-2">
                    <Crop size={18} />
                    Crop Profile Picture
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleCancel}
                        className="btn btn-ghost btn-sm btn-circle"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="px-4 py-2 bg-base-200/50 border-b border-base-300">
                <p className="text-sm opacity-70">
                    Drag to select the area for your profile picture. The crop is locked to a 1:1 ratio.
                </p>
            </div>

            {/* Crop Area */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-base-300/30">
                <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                >
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Crop preview"
                        onLoad={onImageLoad}
                        style={{ maxHeight: 'calc(100vh - 180px)', maxWidth: '100%' }}
                    />
                </ReactCrop>
            </div>

            {/* Action Buttons */}
            <div className="bg-base-200 px-4 py-3 flex justify-end gap-2 border-t border-base-300">
                <button className="btn btn-ghost gap-2" onClick={handleCancel}>
                    <X size={16} />
                    Cancel
                </button>
                <button className="btn btn-primary gap-2" onClick={handleApply}>
                    <Check size={16} />
                    Apply
                </button>
            </div>
        </div>
    );
};

export default ImageCropperWindow;
