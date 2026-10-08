import { __ } from "@wordpress/i18n";

import {
  useBlockProps,
  InspectorControls,
  InnerBlocks,
} from "@wordpress/block-editor";

import {
  SelectControl,
  TextControl,
  ToggleControl,
  Button,
  Placeholder,
  RangeControl,
} from "@wordpress/components";

import { ColorPalette } from "@wordpress/block-editor";

import { MediaUpload, MediaUploadCheck } from "@wordpress/block-editor";
import { getVideoEmbedUrl } from "../utils/video";
import { useInserterPreview, BlockPreviewMock } from "../utils/preview";
import { hexToRgba, getSpacingVars } from "../utils/style";
import {
  BlockConfigPanel,
  AppearancePanel,
} from "../utils/inspector-panels";

const dividerStyle = {
  borderTop: "1px solid #dcdcde",
  margin: "10px 0",
};

function VideoControlDivider() {
  return <div style={dividerStyle} aria-hidden="true" />;
}

export default function Edit({ attributes, setAttributes }) {
  const isPreview = useInserterPreview(attributes);
  if (isPreview) {
    return (
      <BlockPreviewMock
        kicker={__("Video Block", "lacadev")}
        title={__("Nhúng video từ URL hoặc file", "lacadev")}
        columns={2}
      />
    );
  }

  const {
    sourceType,
    videoUrl,
    videoId,
    videoFileUrl,
    autoplay,
    loop,
    muted,
    controls,
    posterUrl,
    posterId,
    overlayEnabled,
    overlayColor,
    overlayOpacity,
    overlayText,
    overlayFontSize,
    overlayTextColor = "#ffffff",
    overlayTextAlign = "center",
    overlayVerticalAlign = "center",
    bgColor,
    bgOpacity,
    spacing,
  } = attributes;

  const backgroundColor = hexToRgba(bgColor || "#0f0f0f", bgOpacity);
  const blockProps = useBlockProps({
    className: "laca-video-block",
    style: {
      ...getSpacingVars(spacing, "--laca-video"),
    },
  });

  const handleSelectVideo = (media) => {
    setAttributes({
      videoId: media.id,
      videoFileUrl: media.url,
    });
  };

  const handleRemoveVideo = () => {
    setAttributes({
      videoId: 0,
      videoFileUrl: "",
    });
  };

  const handleSelectPoster = (media) => {
    setAttributes({
      posterId: media.id,
      posterUrl: media.url,
    });
  };

  const handleRemovePoster = () => {
    setAttributes({
      posterId: 0,
      posterUrl: "",
    });
  };

  const hasVideo =
    (sourceType === "url" && videoUrl) ||
    (sourceType === "file" && videoFileUrl);

  return (
    <>
      <InspectorControls>
        <AppearancePanel
          textdomain="lacadev"
          bgColor={bgColor}
          bgOpacity={bgOpacity}
          spacing={spacing}
          setAttributes={setAttributes}
        />

        <BlockConfigPanel title="Cấu hình video" textdomain="lacadev" initialOpen={true}>
          <SelectControl
            label={__("Nguồn Video", "lacadev")}
            value={sourceType}
            options={[
              { label: __("URL (YouTube, Vimeo…)", "lacadev"), value: "url" },
              { label: __("File Upload", "lacadev"), value: "file" },
            ]}
            onChange={(val) => setAttributes({ sourceType: val })}
          />

          {sourceType === "url" && (
            <TextControl
              label={__("URL Video", "lacadev")}
              value={videoUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(val) => setAttributes({ videoUrl: val })}
            />
          )}

          {sourceType === "file" && (
            <>
              <VideoControlDivider />
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={handleSelectVideo}
                  allowedTypes={["video"]}
                  value={videoId}
                  render={({ open }) => (
                    <div className="laca-video-block__media-control">
                      {videoFileUrl ? (
                        <>
                          <video
                            src={videoFileUrl}
                            preload="metadata"
                            style={{
                              width: "100%",
                              maxHeight: "160px",
                              borderRadius: "4px",
                              marginBottom: "8px",
                            }}
                          />
                          <Button
                            variant="secondary"
                            onClick={open}
                            style={{ marginRight: "8px" }}
                          >
                            {__("Thay video", "lacadev")}
                          </Button>

                          <Button
                            variant="link"
                            isDestructive
                            onClick={handleRemoveVideo}
                          >
                            {__("Xoá", "lacadev")}
                          </Button>
                        </>
                      ) : (
                        <Button variant="primary" onClick={open}>
                          {__("Chọn File Video", "lacadev")}
                        </Button>
                      )}
                    </div>
                  )}
                />
              </MediaUploadCheck>
            </>
          )}

          <VideoControlDivider />
          <MediaUploadCheck>
            <MediaUpload
              onSelect={handleSelectPoster}
              allowedTypes={["image"]}
              value={posterId}
              render={({ open }) => (
                <div className="laca-video-block__media-control">
                  {posterUrl ? (
                    <>
                      <img
                        src={posterUrl}
                        alt={__("Poster", "lacadev")}
                        style={{
                          width: "100%",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          marginBottom: "8px",
                        }}
                      />
                      <Button
                        variant="secondary"
                        onClick={open}
                        style={{ marginRight: "8px" }}
                      >
                        {__("Thay poster", "lacadev")}
                      </Button>
                      <Button
                        variant="link"
                        isDestructive
                        onClick={handleRemovePoster}
                      >
                        {__("Xoá", "lacadev")}
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" onClick={open}>
                      {__("Chọn Ảnh Poster", "lacadev")}
                    </Button>
                  )}
                </div>
              )}
            />
          </MediaUploadCheck>

          <VideoControlDivider />
          <ToggleControl
            label={__("Hiển thị controls", "lacadev")}
            checked={controls}
            onChange={(val) => setAttributes({ controls: val })}
          />
          <VideoControlDivider />
          <ToggleControl
            label={__("Tự động phát", "lacadev")}
            checked={autoplay}
            onChange={(val) => setAttributes({ autoplay: val })}
          />
          <VideoControlDivider />
          <ToggleControl
            label={__("Tắt tiếng", "lacadev")}
            checked={muted}
            onChange={(val) => setAttributes({ muted: val })}
          />
          <VideoControlDivider />
          <ToggleControl
            label={__("Lặp lại", "lacadev")}
            checked={loop}
            onChange={(val) => setAttributes({ loop: val })}
          />

          <VideoControlDivider />
          <ToggleControl
            label={__("Bật overlay", "lacadev")}
            checked={overlayEnabled}
            onChange={(val) => setAttributes({ overlayEnabled: val })}
          />
          {overlayEnabled && (
            <>
              <VideoControlDivider />
              <p
                style={{
                  marginBottom: "4px",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: "#1e1e1e",
                }}
              >
                {__("Màu overlay", "lacadev")}
              </p>
              <ColorPalette
                value={overlayColor}
                onChange={(val) =>
                  setAttributes({ overlayColor: val || "#000000" })
                }
              />
              <RangeControl
                label={__("Độ mờ overlay (%)", "lacadev")}
                value={overlayOpacity}
                min={0}
                max={100}
                step={5}
                onChange={(val) => setAttributes({ overlayOpacity: val })}
              />
              <RangeControl
                label={__("Cỡ chữ overlay (px)", "lacadev")}
                value={overlayFontSize}
                min={10}
                max={120}
                step={1}
                onChange={(val) => setAttributes({ overlayFontSize: val })}
              />
              <p
                style={{
                  marginBottom: "4px",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: "#1e1e1e",
                  marginTop: "16px",
                }}
              >
                {__("Màu chữ", "lacadev")}
              </p>
              <ColorPalette
                value={overlayTextColor}
                onChange={(val) =>
                  setAttributes({ overlayTextColor: val || "#ffffff" })
                }
              />
              <SelectControl
                label={__("Căn ngang", "lacadev")}
                value={overlayTextAlign}
                options={[
                  { label: __("Trái", "lacadev"), value: "flex-start" },
                  { label: __("Giữa", "lacadev"), value: "center" },
                  { label: __("Phải", "lacadev"), value: "flex-end" },
                ]}
                onChange={(val) => setAttributes({ overlayTextAlign: val })}
              />
              <SelectControl
                label={__("Căn dọc", "lacadev")}
                value={overlayVerticalAlign}
                options={[
                  { label: __("Trên", "lacadev"), value: "flex-start" },
                  { label: __("Giữa", "lacadev"), value: "center" },
                  { label: __("Dưới", "lacadev"), value: "flex-end" },
                ]}
                onChange={(val) => setAttributes({ overlayVerticalAlign: val })}
              />
            </>
          )}
        </BlockConfigPanel>

      </InspectorControls>

      <div {...blockProps}>
        {!hasVideo ? (
          <Placeholder
            icon="video-alt3"
            label={__("Video Block", "lacadev")}
            instructions={__(
              "Chọn nguồn video ở thanh bên phải (URL hoặc file upload)",
              "lacadev",
            )}
            className="laca-video-block__placeholder"
          />
        ) : (
          <div
            className="laca-video-block__preview"
            style={{ position: "relative", background: backgroundColor }}
          >
            {sourceType === "url" && videoUrl ? (
              <div className="laca-video-block__iframe-wrap">
                <iframe
                  src={getVideoEmbedUrl(videoUrl)}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: 0 }}
                  title="Video preview"
                />
              </div>
            ) : (
              <video
                src={videoFileUrl}
                poster={posterUrl || undefined}
                controls={controls}
                preload="metadata"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            )}

            {/* Overlay preview */}
            {overlayEnabled && (
              <div
                className="laca-video-block__overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: overlayColor,
                  opacity: overlayOpacity / 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* RichText overlay text — luôn hiển thị khi overlay bật */}
            {overlayEnabled && (
              <div
                className="laca-video-block__overlay-text"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: overlayVerticalAlign,
                  justifyContent: overlayTextAlign,
                  padding: "2rem",
                  zIndex: 2,
                  fontSize: `${overlayFontSize}px`,
                  color: overlayTextColor,
                }}
              >
                <InnerBlocks
                  template={[
                    [
                      "core/paragraph",
                      {
                        placeholder: "Nhập nội dung overlay...",
                        align: "center",
                      },
                    ],
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
