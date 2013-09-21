#ifndef N_FILE_TAB_EDITOR_H
#define N_FILE_TAB_EDITOR_H

#include "n_tree_view.h"

#include <QFileSystemModel>
#include <QWidget>

namespace Ui {
class NFileTabEditor;
}

class NFileTabEditor : public QWidget
{
    Q_OBJECT

public:
    explicit NFileTabEditor(QWidget *parent = 0);
    void setCurrentProject(QString dirPath);
    ~NFileTabEditor();

protected:
    NTreeView *mFileTreeView;
    QTabWidget *mFileTabWidget;
    QDir *mProjectDir;
    QString mProjectName;
    QString mRootDirName;
    QFileSystemModel *mFileSysteMmodel;
    QString mFileExtension;

    void init(NTreeView *fileTreeView, QTabWidget *fileTabWidget);

protected slots:
    void newFile();
};

#endif // N_FILE_TAB_EDITOR_H
