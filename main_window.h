#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

#include "extend/n_tree_view.h"
#include "n_file_widget.h"

#include <QMainWindow>
#include <QDir>
#include <QFileSystemModel>
#include <QProcess>

#include <window/n_pref_dialog.h>

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
    NTreeView *mFileTreeView;
    QTabWidget *mFileTabWidget;
    QWidget *mTabBackgroundWidget;
    QFileSystemModel *mFileSysteMmodel;
    QProcess *mGoogleChromeProcess;
    NPrefDialog *mPrefDialog;

private:
    void setCurrentProject(QString dirPath);
    QList<int> searchTabIndexesByPath(const QString &path, const bool &isDir);
    bool isFileContentChanged(int tabIndex);
    bool saveFile(int tabIndex);

private slots:
    void openProject();
    void newProject();
    void showFileOpener();
    void saveAll();
    void launchGoogleChrome();
    void validate();
    void contextMenu(QPoint point);
    void openFile(QModelIndex index);
    void openFile(const QString &filePath);
    void closeFile(int tabIndex);
    void closeCurrentFile();
    void nextFile();
    void prevFile();
    void newJSFile();
    void newLayoutFile();
    void newDir();
    void importJS();
    void importLayout();
    void importImage();
    void deletePath();
    void renamePath();
    void copyPath();
    void updateTabForPathChanged(const QString &oldPath, const QString &newPath);
    void updateTabForDropped(QString dropDirPath, QString selectedFilePath);
    void updateTabForPathDeleted(const QString &path, const bool &isDir);
    void updateTabForFileChanged(NFileWidget *fileWidget);
    void tabChanged(int index);
};

#endif // MAIN_WINDOW_H
