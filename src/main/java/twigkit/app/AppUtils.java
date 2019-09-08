package twigkit.app;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import twigkit.fig.Config;
import twigkit.fig.Fig;
import twigkit.util.FigUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;

/**
 * Utility class for handling general app operations
 *
 * @author scottbrown
 */
public class AppUtils {

    private static final Logger logger = LoggerFactory.getLogger(AppUtils.class);

    private static final String[] PLATFORM_DATA_CONFIG = new String[]{"platforms", "fusion", "data"};
    private static final String APPLICATION_TITLE = "application-title";

    /**
     * Check whether the application is running in production mode.
     *
     * @return <tt>true</tt> if the application is running in production mode.
     */
    public static Boolean isProductionMode() {
        final String appMode = System.getProperty("lucidworks.app.mode");
        return appMode != null && appMode.equals("production");
    }

    /**
     * Generates a "Fusion-aware" context path
     *
     * @param request incoming request
     * @return the context path
     */
    public static String contextPath(HttpServletRequest request) {
        return hasFusionHeaders(request) && !isAppStudio(request) ? "/webapps" + request.getContextPath() : request.getContextPath();
    }

    /**
     * Checks whether the request has any "fusion-" headers.
     *
     * @param request incoming HTTP request
     * @return <tt>true</tt> if the request contains a "fusion-" header.
     */
    public static boolean hasFusionHeaders(HttpServletRequest request) {
        Enumeration requestHeaderNames = request.getHeaderNames();

        List<String> headerNames = new ArrayList<>();
        while (requestHeaderNames.hasMoreElements()) {
            Object requestHeaderName = requestHeaderNames.nextElement();

            if (requestHeaderName instanceof String) {
                headerNames.add((String) requestHeaderName);
            }
        }

        return headerNames.stream().anyMatch(p -> p.startsWith("fusion-"));
    }

    /**
     * Check if the app is running within the App Studio context
     *
     * @param request incoming HTTP request
     * @return <tt>true</tt> if the app is running in the App Studio context.
     */
    public static boolean isAppStudio(HttpServletRequest request) {
        return request.getContextPath().equals("/app-studio");
    }

    /**
     * Retrieve the application title from configuration
     *
     * @return the application title
     */
    public static String title() {
        Fig fig = Fig.getInstance(FigUtils.getApplicationLoader());
        if (fig != null) {
            Config config = fig.get(PLATFORM_DATA_CONFIG);

            if (config != null) {
                return config.value(APPLICATION_TITLE).as_string();
            }
        }
        
        logger.debug("Application title could not be retrieved from configuration");
        return "";
    }
}

