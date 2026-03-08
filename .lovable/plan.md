

## Replace Hero Background Video

**What**: Swap the current Pixabay nature video with a business/freelance-themed video that matches the Freelancer platform brand.

**Video selection**: I'll use a Pixabay business/technology video showing people working on laptops or collaborating — matching the freelance work theme. A few good candidates from Pixabay's CDN:

- `https://cdn.pixabay.com/video/2016/09/01/4830-181802498_large.mp4` — typing on laptop, professional setting
- `https://cdn.pixabay.com/video/2020/07/30/45691-445828737_large.mp4` — business team collaboration

**Change**: Single line edit in `src/pages/Index.tsx` — replace the video `<source>` URL (line ~441).

**Overlay**: Keep the existing semi-transparent overlay and backdrop blur for text readability.

