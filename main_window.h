#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

#include "window/n_exec_widget.h"
#include "extend/n_tree_view.h"

#include <QMainWindow>
#include <QDir>
#include <QFileSystemModel>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

private:
    Ui::MainWindow *ui;
    QString mProjectName;
    QDir *mProjectDir;
    NExecWidget *mExecWidget;
    NTreeView *mFileTreeView;
    QTabWidget *mFileTabWidget;
    QWidget *mTabBackgroundWidget;
    QFileSystemModel *mFileSysteMmodel;

private:
    void setCurrentProject(QString dirPath);
    QList<int> searchTabIndexesByPath(const QString &path, const bool &isDir);
    bool isFileContentChanged(int tabIndex);
    void saveAllFile();
    bool saveFile(int tabIndex);
    //fixme:
    //QWidget *createTabWidget(const QString &filePath) = 0;
    //QString editedFileContent(QWidget *widget) = 0;

private slots:
    void openProject();
    void newProject();
    void saveAll();
    void execNavy();
    void contextMenu(QPoint point);
    void openFile(QModelIndex index);
    void closeFile(int tabIndex);
    void newFile();
    void newDir();
    void importPath();
    void deletePath();
    void renamePath();
    void copyPath();
    void updateTabForPathChanged(const QString &oldPath, const QString &newPath);
    void updateTabForDropped(QString dropDirPath, QString selectedFilePath);
    void updateTabForPathDeleted(const QString &path, const bool &isDir);
    void updateTabForCurrentFileContentChanged();
};

#endif // MAIN_WINDOW_H
