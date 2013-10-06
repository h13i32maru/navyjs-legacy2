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
    QStringList images();
    QStringList codes();
    QStringList layouts();
};

#endif // N_PROJECT_H
