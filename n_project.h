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

public:
    void setProject(const QString &projectDirPath);

    TYPE fileType(const QString &filePath) const;
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
