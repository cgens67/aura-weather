package com.auraweather.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Resource")
public class ResourcePlugin extends Plugin {

    @PluginMethod
    public void getString(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Must provide a string name");
            return;
        }

        int resId = getContext().getResources().getIdentifier(name, "string", getContext().getPackageName());
        if (resId == 0) {
            call.reject("String resource not found: " + name);
            return;
        }

        String value = getContext().getString(resId);
        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }
}
