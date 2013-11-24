#include "plugin/view_plugin.h"

#include <QDir>

ViewPlugin* ViewPlugin::mInstance = NULL;

ViewPlugin* ViewPlugin::instance() {
    if (mInstance == NULL) {
        mInstance = new ViewPlugin();
    }

    return mInstance;
}

ViewPlugin::ViewPlugin() {
}

void ViewPlugin::load(const QString &pluginDirPath) {
    QDir pluginDir(pluginDirPath);
    pluginDir.setFilter(QDir::NoDotAndDotDot | QDir::Dirs);
    QStringList dirNames = pluginDir.entryList();

    for (int i = 0; i < dirNames.length(); i++) {
        QString manifestPath = pluginDirPath + "/" + dirNames[i] + "/manifest.json";
        NJson manifestJson;
        manifestJson.parseFromFilePath(manifestPath);
        if (manifestJson.getStr("type") != "view") {
            continue;
        }

        NJson scripts = manifestJson.getObject("scripts");
        for (int j = 0; j < scripts.length(); j++) {
            QString jsonName = scripts.getStr(QString::number(j));
            QString jsonPath = pluginDirPath + "/" + dirNames[i] + "/" + jsonName;
            NJson json;
            json.parseFromFilePath(jsonPath);
            mJsonList.append(json);
        }
    }
}

QList<NJson> ViewPlugin::getJsonList() const {
    return mJsonList;
}
