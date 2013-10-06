#include "n_project.h"
#include "util/n_util.h"

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
