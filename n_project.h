#ifndef N_PROJECT_H
#define N_PROJECT_H

#include <QDir>

class NProject
{
public:
    static NProject *instance();

private:
    static NProject *mInstance;

private:
    NProject();
    QDir mProject;

public:
    void setProject(const QString &projectDirPath);
    QStringList scenes();
    QStringList pages();
    QStringList images();
    QStringList codes();
    QStringList layouts();
    bool existsFile(const QString &relativePath);
    bool existsPage(const QString &page);
    QString absoluteFilePath(const QString &relativePath);
};

#endif // N_PROJECT_H
