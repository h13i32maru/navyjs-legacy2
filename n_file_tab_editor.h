#ifndef N_FILE_TAB_EDITOR_H
#define N_FILE_TAB_EDITOR_H

#include <QWidget>

namespace Ui {
class NFileTabEditor;
}

class NFileTabEditor : public QWidget
{
    Q_OBJECT

public:
    explicit NFileTabEditor(QWidget *parent = 0);
//    void setCurrentProject(QString dirPath);
    ~NFileTabEditor();

private:
    Ui::NFileTabEditor *ui;
//    QDir *mProjectDir;
//    QString mProjectName;
//    QString mRootDirName;
//    QFileSystemModel *mFileSysteMmodel;
};

#endif // N_FILE_TAB_EDITOR_H
