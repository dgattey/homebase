package homebase;

import com.leapmotion.leap.Controller;
import com.leapmotion.leap.Frame;
import com.leapmotion.leap.Gesture;
import com.leapmotion.leap.Listener;

/**
 * @author dgattey
 */
public class LEAPListener extends Listener {

    @Override
    public void onConnect(final Controller controller) {
        System.out.println("Connected");
        controller.enableGesture(Gesture.Type.TYPE_SWIPE);
    }

    @Override
    public void onFrame(final Controller controller) {
        final Frame frame = controller.frame();
        System.out.println("Hands: " + frame.hands().count() + ", fingers: " + frame.fingers().count() + ", tools: "
                + frame.tools().count() + ", gestures " + frame.gestures().count());
    }
}
