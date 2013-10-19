#ifndef N_PROJECT_H
#define N_PROJECT_H

#include <QDir>

class NProject
{
public:
    enum FILE_TYPE {
        FILE_TYPE_UNKNOWN,
        FILE_TYPE_CONFIG_APP,
        FILE_TYPE_CONFIG_SCENE,
        FILE_TYPE_CONFIG_PAGE,
        FILE_TYPE_CODE,
        FILE_TYPE_LAYOUT,
        FILE_TYPE_IMAGE
    };

    static NProject *instance();

private:
    static NProject *mInstance;

private:
    NProject();
    QDir mProjectDir;

public:
    void setProject(const QString &projectDirPath);

    FILE_TYPE fileType(const QString &filePath) const;
    bool isConfigApp(const QString &filePath) const;
    bool isConfigScene(const QString &filePath) const;
    bool isConfigPage(const QString &filePath) const;
    bool isCode(const QString &filePath) const;
    bool isLayout(const QString &filePath) const;
    bool isImage(const QString &filePath) const;

    QString filePath(const QString &relativePath) const;
    QString relativeLayoutFilePath(const QString &filePath) const;

    bool validate();
    QStringList scenes();
    QStringList pages();
    QStringList images();
    QStringList codes();
    QStringList layouts();
    QStringList files();
    bool existsFile(const QString &relativePath);
    bool existsPage(const QString &page);
    QString absoluteFilePath(const QString &relativePath);
};

#endif // N_PROJECT_H
