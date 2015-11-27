package homebase;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import com.leapmotion.leap.Controller;

/**
 * @author dgattey
 */
public class App {

    /**
     * @param args
     *            Arguments to program
     */
    public static void main(final String[] args) {
        // Sets up a controller for LEAP
        final Controller controller = new Controller();
        final LEAPListener listener = new LEAPListener();

        // Start receiving events from controller and wait for user termination
        controller.addListener(listener);
        doREPL();

        // Remove the listener when done
        controller.removeListener(listener);
    }

    /**
     * Simply executes a REPL until the user enters an empty line
     */
    static void doREPL() {
        final BufferedReader buffer = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while (true) {
            System.out.println("Enter text or quit with an empty line: ");
            try {
                line = buffer.readLine();
                if (line == null || line.equals("")) {
                    break;
                }
            } catch (final IOException e) {
                e.printStackTrace();
                break;
            }
        }
    }
}