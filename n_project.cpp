#include "n_project.h"
#include "util/n_util.h"
#include "util/n_json.h"

#include <QFileInfo>
#include <QDebug>

#include <window/n_build_error_dialog.h>

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
    mProjectDir.setPath(projectDirPath);
    mProjectName = mProjectDir.dirName();
}

QString NProject::projectName() const {
    return mProjectName;
}

NProject::TYPE NProject::fileType(const QString &filePath) const {
    if (filePath == contentsFilePath("config/app.json")) {
        return TYPE_CONFIG_APP;
    }

    if (filePath == contentsFilePath("config/scene.json")) {
        return TYPE_CONFIG_SCENE;
    }

    if (filePath == contentsFilePath("config/page.json")) {
        return TYPE_CONFIG_PAGE;
    }

    QString ext = QFileInfo(filePath).suffix().toLower();
    QString codeDirPath = contentsFilePath("code");
    QString layoutDirPath = contentsFilePath("layout");
    QString imageDirPath = contentsFilePath("image");

    if (filePath == codeDirPath) {
        return TYPE_CODE_DIR;
    }

    if (filePath == layoutDirPath) {
        return TYPE_LAYOUT_DIR;
    }

    if (filePath == imageDirPath) {
        return TYPE_IMAGE_DIR;
    }

    if (ext == "js" && filePath.indexOf(codeDirPath) != -1) {
        return TYPE_CODE;
    }

    if (ext == "json" && filePath.indexOf(layoutDirPath) != -1) {
        return TYPE_LAYOUT;
    }

    if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "gif") {
        if (filePath.indexOf(imageDirPath) != -1) {
            return TYPE_IMAGE;
        }
    }

    return TYPE_UNKNOWN;
}

QString NProject::contentsFilePath(const QString &relativePath) const {
    return mProjectDir.absoluteFilePath("contents/" + relativePath);
}

QString NProject::contentsDirPath() const {
    return mProjectDir.absoluteFilePath("contents");
}

bool NProject::existsContentsFile(const QString &relativePath) {
    QString path = contentsFilePath(relativePath);
    return QFileInfo(path).exists();
}

QString NProject::relativeLayoutFilePath(const QString &filePath) const {
    if (fileType(filePath) != TYPE_LAYOUT) {
        qDebug() << "file is not layout file." << filePath;
        return "";
    }

    return QString(filePath).remove(0, contentsDirPath().length() + 1);
}

bool NProject::validate() {
    QStringList result;

    {
        QStringList codeList = codes();
        QStringList layoutList = layouts();
        QStringList pageList = pages();

        NJson sceneConfig;
        sceneConfig.parseFromFilePath(contentsFilePath("config/scene.json"));
        for (int i = 0; i < sceneConfig.length(); i++) {
            QString index = QString::number(i);
            QString sceneId = sceneConfig.getStr(index + ".id");

            QString classFilePath = sceneConfig.getStr(index + ".classFile");
            if (codeList.indexOf(classFilePath) == -1) {
                result << QString("error: code[%1] used by scene[%2] is not exists.").arg(classFilePath).arg(sceneId);
            }

            QString layoutPath = sceneConfig.getStr(index + ".extra.contentLayoutFile");
            if (layoutList.indexOf(layoutPath) == -1) {
                result << QString("error: layout[%1] used by scene[%2] is not exists.").arg(layoutPath).arg(sceneId);
            }

            QString page = sceneConfig.getStr(index + ".extra.page");
            if (pageList.indexOf(page) == -1) {
                result << QString("error: page[%1] used by scene[%2] is not exists.").arg(page).arg(sceneId);
            }

        }

        NJson pageConfig;
        pageConfig.parseFromFilePath(contentsFilePath("config/page.json"));
        for (int i = 0; i < sceneConfig.length(); i++) {
            QString index = QString::number(i);
            QString pageId = pageConfig.getStr(index + ".id");

            QString classFilePath = pageConfig.getStr(index + ".classFile");
            if (codeList.indexOf(classFilePath) == -1) {
                result << QString("error: code[%1] used by page[%2] is not exists.").arg(classFilePath).arg(pageId);
            }

            QString layoutPath = pageConfig.getStr(index + ".extra.contentLayoutFile");
            if (layoutList.indexOf(layoutPath) == -1) {
                result << QString("error: layout[%1] used by page[%2] is not exists.").arg(layoutPath).arg(pageId);
            }
        }
    }

    if (result.length() != 0) {
        NBuildErrorDialog dialog;
        dialog.setError(result);
        dialog.exec();
        return false;
    }

    return true;
}

QStringList NProject::scenes() {
    QString path = contentsFilePath("config/scene.json");
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

QStringList NProject::pages() {
    QString path = contentsFilePath("config/page.json");
    NJson pageConfig;
    pageConfig.parseFromFilePath(path);

    QStringList pages;
    for (int i = 0; i < pageConfig.length(); i++) {
        QString index = QString::number(i);
        QString page = pageConfig.getObject(index).getStr("id");
        pages.append(page);
    }

    return pages;
}

QStringList NProject::images() {
    QStringList images =  NUtil::recursiveEntryList(contentsFilePath("image"), "image/");
    return images;
}

QStringList NProject::codes() {
    QStringList codes =  NUtil::recursiveEntryList(contentsFilePath("code"), "code/");
    return codes;
}

QStringList NProject::layouts() {
    QStringList layouts =  NUtil::recursiveEntryList(contentsFilePath("layout"), "layout/");
    return layouts;
}

QStringList NProject::files() {
    QStringList list;
    list.append(images());
    list.append(codes());
    list.append(layouts());
    return list;
}

bool NProject::existsPage(const QString &page) {
    QStringList pages = this->pages();
    int index = pages.indexOf(page);
    return index == -1 ? false : true;
}

//QString NProject::absoluteContentsFilePath(const QString &relativePath) {
//    return contentsFilePath(relativePath);
//}
