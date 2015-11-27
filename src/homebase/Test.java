package homebase;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * @author dgattey
 */
public class Test {

    /**
     * @param args
     *            Arguments to program
     */
    public static void main(final String[] args) {
        final BufferedReader buffer = new BufferedReader(new InputStreamReader(System.in));

        // Creates REPL
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