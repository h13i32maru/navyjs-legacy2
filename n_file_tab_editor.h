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

    QList<int> searchTabIndexesByPath(const QString &path, const bool &isDir);
    void init(NTreeView *fileTreeView, QTabWidget *fileTabWidget);
    virtual QWidget *createTabWidget(const QString &filePath) = 0;
    bool isFileContentChanged(int tabIndex);

protected slots:
    void openFile(QModelIndex index);
    void newFile();
    void newDir();
    void deletePath();
    void renamePath();
    void copyPath();
    void updateTabForPathChanged(const QString &oldPath, const QString &newPath);
    void updateTabForDropped(QString dropDirPath, QString selectedFilePath);
    void updateTabForPathDeleted(const QString &path, const bool &isDir);
    void updateTabForCurrentFileContentChanged();
};

#endif // N_FILE_TAB_EDITOR_H
