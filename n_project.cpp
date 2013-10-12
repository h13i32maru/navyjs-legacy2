#include "n_project.h"
#include "util/n_util.h"
#include "util/n_json.h"

NProject* NProject::mInstance = NULL;

NProject* NProject::instance() {
    if (mInstance == NULL) {
        mInstance = new NProject();
    }

    return mInstance;
}

NProject::NProject()
{
}

void NProject::setProject(const QString &projectDirPath) {
    mProject.setPath(projectDirPath);
}

QStringList NProject::scenes() {
    QString path = mProject.absoluteFilePath("config/scene.json");
    NJson sceneConfig;
    sceneConfig.parseFromFilePath(path);

    QStringList scenes;
    for (int i = 0; i < sceneConfig.length(); i++) {
        QString index = QString::number(i);
        QString scene = sceneConfig.getObject(index).getStr("id");
        scenes.append(scene);
    }

    return scenes;
}


QStringList NProject::images() {
    QStringList images =  NUtil::recursiveEntryList(mProject.absoluteFilePath("image"), "image/");
    return images;
}

QStringList NProject::codes() {
    QStringList codes =  NUtil::recursiveEntryList(mProject.absoluteFilePath("code"), "code/");
    return codes;
}

QStringList NProject::layouts() {
    QStringList layouts =  NUtil::recursiveEntryList(mProject.absoluteFilePath("layout"), "layout/");
    return layouts;
}
