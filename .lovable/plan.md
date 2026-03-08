

## Reduce Hero Slideshow Height

The slideshow currently uses `aspectRatio: "16/7"` which is quite tall. I'll reduce it to a shorter aspect ratio.

### Change
- **`src/pages/Index.tsx` line 205**: Change aspect ratio from `16/7` to `16/5` (significantly shorter/more compact)
- Reduce text overlay padding slightly to match the smaller container

