import os
from PIL import Image

def process():
    src_path = r"C:\Users\hp\.gemini\antigravity\brain\65ad541f-1201-414e-a9ce-9a37d2a45228\media__1784716416049.jpg"
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        return

    print("Opening source image...")
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    
    # 1. Create logo.png with transparent background
    print("Generating logo.png...")
    logo = Image.new("RGBA", (width, height))
    logo_data = []
    for y in range(height):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            # If pixel is close to white, make it transparent
            if r > 240 and g > 240 and b > 240:
                logo_data.append((255, 255, 255, 0))
            else:
                logo_data.append((r, g, b, a))
    logo.putdata(logo_data)
    
    # Crop the logo to remove excess padding (bounding box check)
    bbox = logo.getbbox()
    if bbox:
        logo_cropped = logo.crop(bbox)
        # Add some padding back (e.g., 20px on all sides)
        padding = 20
        new_width = logo_cropped.width + padding * 2
        new_height = logo_cropped.height + padding * 2
        logo_padded = Image.new("RGBA", (new_width, new_height), (255, 255, 255, 0))
        logo_padded.paste(logo_cropped, (padding, padding))
        logo_padded.save("public/logo.png", "PNG")
        print("logo.png saved successfully to public/logo.png!")
    else:
        logo.save("public/logo.png", "PNG")
        print("logo.png saved successfully to public/logo.png (uncropped)!")

    # 2. Create logo-light.png (for dark backgrounds)
    print("Generating logo-light.png...")
    logo_light_data = []
    # In the logo, the globe is at the top, text is at the bottom.
    # Let's check: the globe is roughly in the top 62% of the image.
    # For any non-white pixel in the bottom 38% (text), convert to white.
    # For the top 62% (globe), we keep it as is (the green globe looks excellent on dark).
    globe_cutoff = int(height * 0.62)
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            if r > 240 and g > 240 and b > 240:
                # White background -> transparent
                logo_light_data.append((255, 255, 255, 0))
            else:
                if y >= globe_cutoff:
                    # Text section -> convert to white text
                    logo_light_data.append((255, 255, 255, 255))
                else:
                    # Globe section -> keep original green
                    logo_light_data.append((r, g, b, a))
                    
    logo_light = Image.new("RGBA", (width, height))
    logo_light.putdata(logo_light_data)
    
    bbox_light = logo_light.getbbox()
    if bbox_light:
        logo_light_cropped = logo_light.crop(bbox_light)
        padding = 20
        new_width = logo_light_cropped.width + padding * 2
        new_height = logo_light_cropped.height + padding * 2
        logo_light_padded = Image.new("RGBA", (new_width, new_height), (255, 255, 255, 0))
        logo_light_padded.paste(logo_light_cropped, (padding, padding))
        logo_light_padded.save("public/logo-light.png", "PNG")
        print("logo-light.png saved successfully to public/logo-light.png!")
    else:
        logo_light.save("public/logo-light.png", "PNG")
        print("logo-light.png saved successfully to public/logo-light.png (uncropped)!")

    # 3. Create icon.png (cropped globe and leaf, square favicon)
    print("Generating icon.png...")
    # The globe is roughly from y=0 to y=620, x=100 to x=920
    # Let's crop the globe bounding box
    globe_img = Image.new("RGBA", (width, globe_cutoff))
    globe_data = []
    for y in range(globe_cutoff):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            if r > 240 and g > 240 and b > 240:
                globe_data.append((255, 255, 255, 0))
            else:
                globe_data.append((r, g, b, a))
    globe_img.putdata(globe_data)
    
    bbox_globe = globe_img.getbbox()
    if bbox_globe:
        globe_cropped = globe_img.crop(bbox_globe)
        # Make it a square by adding padding to the shorter side
        max_dim = max(globe_cropped.width, globe_cropped.height)
        icon = Image.new("RGBA", (max_dim, max_dim), (255, 255, 255, 0))
        # Center the cropped globe
        x_offset = (max_dim - globe_cropped.width) // 2
        y_offset = (max_dim - globe_cropped.height) // 2
        icon.paste(globe_cropped, (x_offset, y_offset))
        # Resize to a standard large icon size, e.g. 512x512
        icon_resized = icon.resize((512, 512), Image.Resampling.LANCZOS)
        icon_resized.save("src/app/icon.png", "PNG")
        print("icon.png saved successfully to src/app/icon.png!")
    else:
        print("Error: Could not crop globe for icon.png")

if __name__ == "__main__":
    process()
