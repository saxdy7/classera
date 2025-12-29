# Message Notification Sound

This directory should contain the notification sound file.

## Required File
- `message-notification.mp3` - Audio file that plays when a new message arrives

## Where to Get Notification Sounds

### Free Sound Resources:
1. **Zapsplat** - https://www.zapsplat.com/sound-effect-category/notifications/
   - Free notification sounds
   - No attribution required for most sounds

2. **Freesound** - https://freesound.org/search/?q=notification
   - Community-uploaded sounds
   - Check license requirements

3. **Notification Sounds** - https://notificationsounds.com/
   - Dedicated notification sound library
   - Free for personal/commercial use

### Recommended Sounds:
- Short (< 1 second)
- Pleasant, not jarring
- Clear but not too loud
- Professional tone

## How to Add the Sound

1. Download a notification sound (MP3 format)
2. Rename it to `message-notification.mp3`
3. Place it in this directory (`public/sounds/`)
4. The `useMessageSound` hook will automatically use it

## Alternative: Use a Data URI

If you don't want to add a file, you can modify `src/hooks/useMessageSound.ts` to use a data URI for a simple beep:

```typescript
// Replace the audio source with a simple beep
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

oscillator.frequency.value = 800; // Frequency in Hz
oscillator.type = 'sine';
gainNode.gain.value = 0.3; // Volume

oscillator.start();
oscillator.stop(audioContext.currentTime + 0.1); // 100ms beep
```

## Testing the Sound

1. Open the messages page
2. Send a message from another window
3. You should hear the notification sound
4. If not, check browser console for errors
5. Some browsers block autoplay - user interaction may be required first
