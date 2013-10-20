#ifndef N_PROJECT_H
#define N_PROJECT_H

#include <QDir>

class NProject
{
public:
    enum TYPE {
        TYPE_UNKNOWN,
        TYPE_CONFIG_APP,
        TYPE_CONFIG_SCENE,
        TYPE_CONFIG_PAGE,
        TYPE_CODE,
        TYPE_CODE_DIR,
        TYPE_LAYOUT,
        TYPE_LAYOUT_DIR,
        TYPE_IMAGE,
        TYPE_IMAGE_DIR
    };

    static NProject *instance();

private:
    static NProject *mInstance;

private:
    NProject();
    QDir mProjectDir;
    QString mProjectName;

public:
    void setProject(const QString &projectDirPath, const QString &projectName);
    QString projectName() const;

    TYPE fileType(const QString &contentsFilePath) const;
    QString contentsFilePath(const QString &relativePath) const;
    QString relativeLayoutFilePath(const QString &contentsFilePath) const;
    QString contentsDirPath() const;

    bool validate();
    QStringList scenes();
    QStringList pages();
    QStringList images();
    QStringList codes();
    QStringList layouts();
    QStringList files();
    bool existsContentsFile(const QString &relativePath);
    bool existsPage(const QString &page);
//    QString absoluteContentsFilePath(const QString &relativePath);

public slots:
    void showSettingDialog();
};

#endif // N_PROJECT_H
